Then /^the output should eventually contain "([^"]*)"$/ do |expected|
  terminate_processes!

  while true
    if all_output.index(expected)
      assert_partial_output(expected, all_output)
      break
    end
    sleep 1
  end
  
end
