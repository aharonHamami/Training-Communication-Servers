ECHO OFF
ECHO starting all the servers...
START "Communication Server" NODE .\Communication-Server\
START "Registeration Server" NODE .\Registeration-Server\
START "Editing Server" NODE .\Editing-Server\
START "Api Gateway" NODE .\Api-Gateway\
@REM PAUSE