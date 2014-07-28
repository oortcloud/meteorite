#!/usr/bin/env ruby

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

def run_and_report(command, version)
  output = `#{command} 2>&1`
  if ($? != 0)
    $versions.update({_id: version['_id']}, {'$set' => {error: output}})
    return false
  end
  return true
end


$versions.find({complete: {'$exists' => false}}).each do |version|
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
  command = "#{MIGRATION_SCRIPT} #{dir_name} #{version['username'] || DEFAULT_USERNAME}"
  next unless run_and_report(command, version)
  
  # 3. register success!
  $versions.update({_id: version['_id']}, {
    '$set' => {complete: true},
    '$unset' => {error: 1}
  });
end