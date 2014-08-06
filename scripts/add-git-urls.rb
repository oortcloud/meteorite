#!/usr/bin/env ruby

require File.join(File.dirname(__FILE__), 'config.rb')
require 'mongo'
include Mongo

mongo_client = MongoClient.new(MONGO_HOST, MONGO_PORT)
$versions = mongo_client[MONGO_DB][MONGO_COLLECTION]

require 'parallel'
require 'json'
versions = $versions.find({complete: true, addedGit: {"$exists" => false}}).to_a
Parallel.each(versions, :in_processes => PROCESSES, :in_threads => THREADS) do |version|
  package_name = version['name']
  sanitized_package_name = package_name.downcase.gsub(/[^a-z0-9.\-]/, '-')
  username = version['username'] || DEFAULT_USERNAME
  troposphere_name = "#{username}:#{sanitized_package_name}"
  version_name = version['version']
  
  command = "ddp --host #{ATMOSPHERE_HOST} --port #{ATMOSPHERE_PORT} subscribe package #{package_name}"
  data = JSON.parse(`#{command}`)
  if ($? != 0 or not data["packages"] or not data["packages"].length)
    STDERR.puts "Problem finding package '#{package_name}' on #{ATMOSPHERE_HOST}:#{ATMOSPHERE_PORT}. Are you sure it's there?"
    next
  end
  
  package = data["packages"].values[0]
  unless (package["name"] === package_name)
    STDERR.puts "Something wrong with package data for #{package_name}"
    next
  end
  git_url = package['git']
  
  if git_url
    puts "Adding git url #{git_url} to package #{troposphere_name}@#{version_name}"
    command = "#{METEOR_EXECUTABLE} admin change-git #{troposphere_name} #{version_name} #{git_url}"
    `#{command}`
    
    if ($? != 0)
      STDERR.puts "Unable to update git url for #{troposphere_name}" 
      next
    end
    
    puts ">> Success! for #{troposphere_name}@#{version_name}"
    $versions.update({_id: version['_id']}, {
      '$set' => {addedGit: true},
    });
  end
end