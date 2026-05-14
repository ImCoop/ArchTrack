@echo off
cd /d "%~dp0.."
node .\scripts\prod-runner.mjs %*
