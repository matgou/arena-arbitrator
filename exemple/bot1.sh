#!/bin/bash

cd $0
dir=`pwd`
while `true`
do
  read nbObject
  for i in `seq 1 $nbObject`
  do
    read line
    echo $line 1>>$dir/ficlog$$.txt
  done
  echo PUSH 10 10
done
