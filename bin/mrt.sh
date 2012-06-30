#!/bin/bash

SUB_COMMAND=${@:1:1}
BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"
MRT_DIR="./.meteor/meteorite"

$MRTJS $@

if [[ $SUB_COMMAND != "install" && $SUB_COMMAND != "uninstall" ]]
then

  if [[ $SUB_COMMAND == "create" ]]
  then

  bash $HOME/.meteorite/meteors/branch/master/meteor $@
  APP_PATH=`$MRTJS post_create $@`
  cd $APP_PATH && $MRTJS install

  else

    echo bash $MRT_DIR/meteor $@
    bash $MRT_DIR/meteor $@

  fi
fi
