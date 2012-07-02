require 'aruba/cucumber'

Before do
  @dirs = ["features/support/fs"]
  @non_test_meteor_pids = `ps -a | grep meteor | grep -v grep | awk '{print $1}'`.split
end

After do |scenario|
  terminate_processes!
  
  @test_meteor_pids = `ps -a | grep meteor | grep -v grep | awk '{print $1}'`.split
  killable_meteor_pids = (@test_meteor_pids - @non_test_meteor_pids)
  if killable_meteor_pids.length > 0
    `kill -9 #{killable_meteor_pids.join(' ')}`
  end
end
