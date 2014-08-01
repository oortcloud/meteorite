#!/usr/bin/env ruby

require File.join(File.dirname(__FILE__), 'config.rb')
require 'json'
require 'open3'

def run_and_check(command)
  stdout, stderr, status = Open3.capture3(command)
  if (status != 0)
    raise "Command #{command} failed:\n" + stderr
  end
end

begin
  # check arguments
  dir = ARGV[0]
  username = ARGV[1]

  # 1. check usage
  if (not dir or not username)
    raise "Usage: ruby migrate-package.rb dir md-username "
  end

  # 2. figure out basic package details
  smart_json = JSON.parse(File.read(File.join(dir, 'smart.json')))
  package_name = smart_json["name"]
  version_name = smart_json["version"]
  raise "Package name not found -- is smart.json OK?" unless package_name
  raise "Version not found -- is smart.json OK?" unless version_name

  # 3. check if package is already registered with our ATMOS host
  command = "ddp --host #{ATMOSPHERE_HOST} --port #{ATMOSPHERE_PORT} subscribe package #{package_name}"
  data = JSON.parse(`#{command}`)
  if ($? != 0 or not data["packages"] or not data["packages"].length)
    raise "Problem finding package '#{package_name}' on #{ATMOSPHERE_HOST}:#{ATMOSPHERE_PORT}. Are you sure it's there?"
  end

  package = data["packages"].values[0]
  raise "Something wrong with package data" unless (package["name"] === package_name)

  version = package["versions"].find {|v| v["version"] == version_name}
  raise "Couldn't find package version #{version} on #{ATMOSPHERE_HOST}:#{ATMOSPHERE_PORT}" unless version

  if version["troposphereIdentifier"]
    raise "Package already registered as #{version["troposphereIdentifier"]}"
  end

  # 4. run `mrt migrate-package` 
  # lowercase, alphanum and '-.', can't start with '.' [not handled]
  sanitized_package_name = package_name.downcase.gsub(/[^a-z0-9.\-]/, '-')
  troposphere_name = "#{username}:#{sanitized_package_name}"
  run_and_check "mrt --repoHost #{ATMOSPHERE_HOST} --repoPort #{ATMOSPHERE_PORT} migrate-package #{dir} #{troposphere_name}"

  unless Dir.exists?(troposphere_name)
    raise "Package Migration Failed to create #{troposphere_name}"
  end

  # 5. publish to troposphere ## XXX: should this bit be moved inside the `migrate-package` command?
  Dir.chdir troposphere_name
  stdout, stderr, status = Open3.capture3("#{METEOR_EXECUTABLE} publish --create")
  # Meteor's exit code for package exists or server error (happen during races)
  if status.exitstatus == 2 or status.exitstatus == 3
     run_and_check "#{METEOR_EXECUTABLE} publish"
  elsif status != 0
    raise "Publishing failed:\n" + stderr
  end

  if username != DEFAULT_USERNAME
    run_and_check "#{METEOR_EXECUTABLE} admin maintainers #{troposphere_name} --add #{username}"
  end

  if package["homepage"]
    run_and_check "#{METEOR_EXECUTABLE} admin change-homepage #{troposphere_name} #{package["homepage"]}"
  end

  # 6. inform atmosphere
  run_and_check "ddp --host #{ATMOSPHERE_HOST} --port #{ATMOSPHERE_PORT} call " +
    "markTroposphereIdentifier #{package_name} #{version_name} #{troposphere_name}@#{version_name}"
rescue Exception => error
  STDERR.puts error.message
  exit(1);
end