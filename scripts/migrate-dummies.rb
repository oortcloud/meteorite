#!/usr/bin/env ruby

# for every package that hasn't already been successfully migrated,
# just migrate a dummy version

require File.join(File.dirname(__FILE__), 'config.rb')
SOURCE_NAME = 'source'
MIGRATION_SCRIPT = File.join(File.dirname(__FILE__), 'migrate-package.rb')
DUMMY_SCRIPT = File.join(File.dirname(__FILE__), 'migrate-dummy.rb')

require 'mongo'
include Mongo

mongo_client = MongoClient.new(MONGO_HOST, MONGO_PORT)
$versions = mongo_client[MONGO_DB][MONGO_COLLECTION]

require 'parallel'
require 'open3'
require 'fileutils'

versions = $versions.find({complete: {'$exists' => false}}).to_a
Parallel.each(versions, :in_processes => PROCESSES, :in_threads => THREADS) do |version|
  
  package_name = version['name']
  sanitized_package_name = package_name.downcase.gsub(/[^a-z0-9.\-]/, '-')
  username = version['username'] || DEFAULT_USERNAME
  troposphere_name = "#{username}:#{sanitized_package_name}"
  version_name = version['version']
  
  # 1. clone the package into the right directory
  top_dir_name = File.join(version['name'], version['version'])
  source_dir_name = File.join(top_dir_name, SOURCE_NAME)
  
  # check if it's already cloned. If so, assume it's all good
  failed = false
  if Dir.exists? source_dir_name
    puts "#{source_dir_name} already checked out, skipping"
  else
    puts "Checking out #{version['git']} to #{source_dir_name}"
    branch = 'v' + version['version']
    command = "git clone --recursive --quiet --depth 1 --branch #{branch} #{version['git']} #{source_dir_name}"
    
    # run it
    stdout, stderr, status = Open3.capture3(command)
    failed = (status != 0)
  end
  
  unless failed
    # 2. call ./migrate-package
    puts "> Migrating #{top_dir_name}"
    command = "#{MIGRATION_SCRIPT} #{SOURCE_NAME} #{version['username'] || DEFAULT_USERNAME}"
    
    # run it (we probably expect it to fail)
    stdout, stderr, status = Open3.capture3(command)
    failed = (status != 0)
  end
  
  if failed
    # just make sure there's a directory there
    troposphere_dir = File.join(top_dir_name, troposphere_name);
    FileUtils.mkdir_p troposphere_dir
    
    command = "#{DUMMY_SCRIPT} #{troposphere_dir} #{package_name} #{username} #{version_name} #{troposphere_name}"
    p command
    stdout, stderr, status = Open3.capture3(command)
    puts stdout
    puts stderr
    failed = (status != 0)
  end
  
  # 3. register success!
  unless failed
    puts ">> Success! for #{top_dir_name}"
    $versions.update({_id: version['_id']}, {
      '$set' => {complete: true, dummy: true},
      '$unset' => {error: 1}
    });
  end
  
  process.exit(1)
end