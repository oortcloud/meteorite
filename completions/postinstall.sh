#!/usr/bin/env sh

# Only show if they're using bash.
if [[ "$SHELL" == *bash* ]]; then

  # Where the bash completion lives.
  file="$(pwd)/completions/mrt.bash"

  # Show sourcing instructions.
  echo "Install meteorite's bash completions by adding the following to your \
.bashrc or .bash_profile:"
  echo "if [ -f $file ]; then"
  echo "  . $file"
  echo "fi\n"
fi
