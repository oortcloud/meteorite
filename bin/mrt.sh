#!/bin/bash

mrt.js $@:1

COMMAND=`mrt.js command ${@:1}`

COMMAND_PARTS=( $COMMAND )
COMMAND_MODE=${COMMAND_PARTS[*]:1:1}

if [[ $COMMAND_MODE == "run" ]]
then
  bash $COMMAND
fi
