#!/bin/bash

BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"

$MRTJS $@:1

COMMAND=`$MRTJS command ${@:1}`

COMMAND_PARTS=( $COMMAND )
MODE=${COMMAND_PARTS[*]:1:1}

if [[ $MODE != "install" ]]
then
  bash $COMMAND
fi
