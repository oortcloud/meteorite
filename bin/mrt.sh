#!/bin/bash

BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"
MRT_DIR="./.meteor/meteorite"

$MRTJS $@
SUB_COMMAND=${@:1:1}

if [[ $SUB_COMMAND != "install" && $SUB_COMMAND != "uninstall" ]]
then
  if [[ $SUB_COMMAND == "create" ]]
  then
    echo "Error: create not yet supported"
  else
    echo bash $MRT_DIR/meteor $@
    bash $MRT_DIR/meteor $@
  fi
fi
