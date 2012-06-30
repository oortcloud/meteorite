#!/bin/bash

BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"

$MRTJS $@:1

COMMAND=${@:1:1}

if [[ $COMMAND != "install" ]]
then
  echo $@
  bash ./.meteor/meteorite/meteor/meteor $@
fi
