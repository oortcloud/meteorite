#!/bin/bash

BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"

$MRTJS $@:1
SUB_COMMAND=${@:1:1}

if [[ $SUB_COMMAND != "install" ]]
then
  bash ./.meteor/meteorite/meteor/meteor $@
fi
