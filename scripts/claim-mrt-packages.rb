#!/usr/bin/env ruby

require 'json'
require File.join(File.dirname(__FILE__), 'config.rb')

username = ARGV[0]


command = "ddp --host #{ATMOSPHERE_HOST} --port #{ATMOSPHERE_PORT} call getMaintainedPackages #{username}"
packages = JSON.parse(`#{command}`)


packages.each do |packagename|
  puts "adding #{username} as author to mrt:#{packagename}"
  `meteor admin maintainers mrt:#{packagename} --add #{username}`
  `meteor admin maintainers mrt:#{packagename} --remove tmeasday`
end