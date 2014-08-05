#!/usr/bin/env ruby

require File.join(File.dirname(__FILE__), 'config.rb')
require 'open3'

def run_and_check(command)
  stdout, stderr, status = Open3.capture3(command)
  if (status != 0)
    raise "Command #{command} failed:\n" + stderr
  end
end

troposphere_dir = ARGV[0]
package_name = ARGV[1]
username = ARGV[2]
version_name = ARGV[3]
troposphere_name = ARGV[4]

Dir.chdir troposphere_dir
command = "#{METEOR_EXECUTABLE} publish-dummy-record #{version_name}"
puts command
stdout, stderr, status = Open3.capture3(command)
if status != 0
  raise "Publishing failed:\n" + stderr
end

if username != DEFAULT_USERNAME
  run_and_check "#{METEOR_EXECUTABLE} admin maintainers #{troposphere_name} --add #{username}"
end

run_and_check "ddp --host #{ATMOSPHERE_HOST} --port #{ATMOSPHERE_PORT} call " +
  "markTroposphereIdentifier #{package_name} #{version_name} #{troposphere_name}@#{version_name}"
