#!/bin/bash

rm -rf "packed"
mkdir -p "packed"

for dir in "chrome" "firefox"; do
    cp -r $dir "packed/$dir"
    cp -r shared/* "packed/$dir"
    echo "Packed $dir"

    if command -v zip &> /dev/null; then
        cd "packed/$dir"
        zip $dir.zip -9qr *
        cd ../../
        echo "Zipped $dir"
    fi
done
