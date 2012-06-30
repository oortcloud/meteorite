#!/bin/bash

is_supported_subcommand() {
  local supported=( "run" "deploy" "update" "add" "list" "remove" "bundle" "reset" "installed" )
  local command=$1
  shift
  for hay; do
      [[ $supported == $command ]] && return 0
  done
  return 1
}

BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"

$MRTJS $@:1
SUB_COMMAND=${@:1:1}

if ! is_supported_subcommand $SUB_COMMAND
then
  SUB_COMMAND=run
fi

if [[ $SUB_COMMAND != "install" ]]
then
  bash ./.meteor/meteorite/meteor/meteor $@
fi
