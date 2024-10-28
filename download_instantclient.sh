#!/bin/bash

# Descargar y configurar Oracle Instant Client
mkdir -p instantclient/instantclient_21_16

# Descargar los archivos (reemplaza FILE_ID con los IDs correctos de Google Drive)
curl -L -o instantclient/instantclient_21_16/libclntsh.so.21.1 "https://drive.google.com/uc?export=download&id=FILE_ID"
curl -L -o instantclient/instantclient_21_16/libociei.so "https://drive.google.com/uc?export=download&id=FILE_ID"
curl -L -o instantclient/instantclient_21_16/libnnz21.so "https://drive.google.com/uc?export=download&id=FILE_ID"

# Dar permisos de ejecución
chmod 755 instantclient/instantclient_21_16/*.so

# Crear el enlace simbólico
ln -s instantclient/instantclient_21_16/libclntsh.so.21.1 instantclient/instantclient_21_16/libclntsh.so

# Verificar el contenido del directorio y el LD_LIBRARY_PATH
echo "Contenido de instantclient/instantclient_21_16:"
ls -l instantclient/instantclient_21_16
echo "LD_LIBRARY_PATH es $LD_LIBRARY_PATH"
