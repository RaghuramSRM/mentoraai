# SQL Core Skills

`WHERE` filters rows before grouping. `HAVING` filters groups after aggregation. A `LEFT JOIN` preserves every row from the left table and attaches matching right-side rows.

Window functions calculate values across related rows without collapsing them. `ROW_NUMBER()` assigns a unique sequence within a partition and ordering.

A primary key uniquely identifies a row. A foreign key links rows across tables and enforces referential integrity. Normalization reduces unnecessary duplication, while selective denormalization may improve read performance when measured carefully.

Transactions group operations into one logical unit. ACID refers to atomicity, consistency, isolation and durability. Indexes can speed up reads but require storage and add write cost, so query plans should guide indexing decisions.

Common table expressions make complex queries easier to read. Parameterized queries separate SQL code from user values and help prevent SQL injection.
