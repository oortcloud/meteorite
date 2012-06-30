#!/bin/bash

BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"

$MRTJS $@:1
SUB_COMMAND=${@:1:1}

if [[ $SUB_COMMAND != "install" ]]
then

  if [[ $SUB_COMMAND == "create" ]]
  then
    echo "Error: create not yet supported"
  else
    bash ./.meteor/meteorite/meteor/meteor $@
  fi
fi
