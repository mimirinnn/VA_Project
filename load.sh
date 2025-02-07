#!/bin/bash

# Check if exactly one argument is passed
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <number between 0 and 3>"
  exit 1
fi

# Validate if the input is a number between 0 and 3
if ! [[ "$1" =~ ^[0-3]$ ]]; then
  echo "Error: Please enter a number between 0 and 3."
  exit 1
fi

# Process based on the input number
case $1 in
  0)
    DIR="src-0"
    ;;
  1)
    DIR="src-01-async"
    ;;
  2)
    DIR="src-02-data"
    ;;
  3)
    DIR="src-03-pi"
    ;;
esac

# Clean src folder and import selected folder
rm -rfv src/* && cp ./$DIR/* ./src/
