#!/usr/bin/env ruby

require File.join(File.dirname(__FILE__), 'config.rb')

require 'json'
require 'mongo'
include Mongo

mongo_client = MongoClient.new(MONGO_HOST, MONGO_PORT)
versions = mongo_client[MONGO_DB][MONGO_COLLECTION]

# first grab data from atmosphere, and write to mongo
command = "ddp --host #{ATMOSPHERE_HOST} --port #{ATMOSPHERE_PORT} subscribe packages"
packages_metadata = JSON.parse(`#{command}`)

command = "ddp --host #{ATMOSPHERE_HOST} --port #{ATMOSPHERE_PORT} subscribe usernames"
usernames_metadata = JSON.parse(`#{command}`)

packages_metadata['packages'].each do |id, pkg|
  username = nil
  
  [pkg['userId']].concat(pkg['userIds'] || []).any? do |user_id|
    user_metadata = usernames_metadata['users'][user_id]
    if (user_metadata and user_metadata['services']['meteor-developer'])
      username = user_metadata['services']['meteor-developer']['username']
    end
  end
  
  pkg['versions'].each do |version|
    begin # uggg, upsert-ish
      versions.insert(
        name: pkg['name'],
        version: version['version'],
        username: username,
        git: version['git']
      )
    rescue
      nil
    end
  end
end