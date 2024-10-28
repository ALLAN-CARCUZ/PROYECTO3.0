#!/bin/bash

# Crear el directorio para Oracle Instant Client si no existe
mkdir -p instantclient/instantclient_21_16

# Función para descargar desde Google Drive
download_from_drive() {
    FILE_ID=$1
    FILE_NAME=$2
    curl -L -o "instantclient/instantclient_21_16/$FILE_NAME" "https://drive.google.com/uc?export=download&id=$FILE_ID"
}

# Descarga de los archivos necesarios
download_from_drive "1u_vgyWY3mO_FfouL1LOICzdFNhWObE9K" "libclntsh.so.21.1"
download_from_drive "1YNB1immIYWep2QORD7gyNdFsOS0qXT2G" "libociei.so"
download_from_drive "13ME6YksV0fDPZ8Zj2dHFEjRTPQ9TDp5D" "libnnz21.so"
