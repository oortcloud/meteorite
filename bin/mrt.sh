#!/bin/bash

BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"
MRT_DIR="./.meteor/meteorite"

$MRTJS $@:1
SUB_COMMAND=${@:1:1}

if [[ $SUB_COMMAND != "install" ]]
then
  if [[ $SUB_COMMAND == "create" ]]
  then
    echo "Error: create not yet supported"
  else
    bash $MRT_DIR/meteor $@
  fi
fi
