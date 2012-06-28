#!/bin/bash

mrt.js $@:1

if [[ $1 == "run" ]]
then
  COMMAND=`mrt.js command ${@:1}`
  `$COMMAND`
fi
