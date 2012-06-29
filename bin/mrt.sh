#!/bin/bash

BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"

$MRTJS $@:1

COMMAND=`$MRTJS command ${@:1}`

COMMAND_PARTS=( $COMMAND )
COMMAND_MODE=${COMMAND_PARTS[*]:1:1}

if [[ $COMMAND_MODE == "run" ]]
then
  bash $COMMAND
fi
