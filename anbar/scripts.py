from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("UPDATE sqlite_sequence SET seq = 10101020000 WHERE name = 'anbar_part';")