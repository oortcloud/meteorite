#!/usr/bin/env ruby

PROCESSES=4

MIGRATION_SCRIPT = File.join(File.dirname(__FILE__), 'migrate-package.rb')
DEFAULT_USERNAME = 'mrt'

MONGO_HOST = 'localhost'
MONGO_PORT = 3011
MONGO_DB = 'meteor'
MONGO_COLLECTION = 'versions'
require 'mongo'
include Mongo

mongo_client = MongoClient.new(MONGO_HOST, MONGO_PORT)
$versions = mongo_client[MONGO_DB][MONGO_COLLECTION]

require 'open3'
def run_and_report(command, version)
  stdout, stderr, status = Open3.capture3(command)
  if (status != 0)
    error = stderr + "\n" + stdout
    $versions.update({_id: version['_id']}, {'$set' => {error: error}})
    return false
  end
  return true
end

require 'parallel'

versions = $versions.find({complete: {'$exists' => false}}).to_a
Parallel.each(versions) do |version|
  # 1. clone the package into the right directory
  dir_name = File.join(version['name'], version['version'])
  
  # check if it's already cloned. If so, assume it's all good
  if Dir.exists? dir_name
    puts "#{dir_name} already checked out, skipping"
  else
    puts "Checking out #{version['git']} to #{dir_name}"
    branch = 'v' + version['version']
    command = "git clone --quiet --depth 1 --branch #{branch} #{version['git']} #{dir_name}"
    
    next unless run_and_report(command, version)
  end
  
  # 2. call ./migrate-package
  puts "> Migrating #{dir_name}"
  command = "#{MIGRATION_SCRIPT} #{dir_name} #{version['username'] || DEFAULT_USERNAME}"
  next unless run_and_report(command, version)
  
  # 3. register success!
  puts ">> Success! for #{dir_name}"
  $versions.update({_id: version['_id']}, {
    '$set' => {complete: true},
    '$unset' => {error: 1}
  });
end