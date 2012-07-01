#!/bin/bash

# Figure out which subcommand is being run
SUB_COMMAND=${@:1:1}

# Figure out paths
BASEDIR=$(dirname "$0")
MRTJS="$BASEDIR/mrt.js"
MRT_DIR="./.meteor/meteorite"

# Run mrt with given arguments
$MRTJS $@

# If we're installing or uninstalling she show is over
if [[ $SUB_COMMAND != "install" && $SUB_COMMAND != "uninstall" ]]
then

  # Do special stuff when creating a new project
  if [[ $SUB_COMMAND == "create" ]]
  then

    # Let meteor create the proj
    bash $HOME/.meteorite/meteors/branch/master/meteor $@

    # Let mrt.js do it's post create trix
    APP_PATH=`$MRTJS post_create $@`
  
    # Install meteorite in new proj
    if [ -d "$APP_PATH" ]; then
      cd $APP_PATH && $MRTJS install
    fi

  else

    # Go ahead and run meteor
    bash $MRT_DIR/meteor $@

  fi
fi
