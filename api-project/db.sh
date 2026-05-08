#!/bin/bash

# Konfigurasi Database
DB_HOST="localhost"
DB_NAME="tester"
DB_USER="root"
DB_PASS="root"
SQL_FILE="database.sql"

echo "Mengimpor $SQL_FILE ke database $DB_NAME..."

# Eksekusi perintah mysql
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "Selesai! Database berhasil diupdate."
else
    echo "Terjadi kesalahan saat mengimpor SQL."
fi
