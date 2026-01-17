# Database Data Viewing Commands

## সব table-এর data দেখার commands:

### 1. Admin Users দেখুন:
```bash
docker exec -it word-game-db psql -U postgres -d wordgame -c "SELECT id, email, role, created_at FROM admin_users;"
```

### 2. Subjects দেখুন:
```bash
docker exec -it word-game-db psql -U postgres -d wordgame -c "SELECT * FROM subjects ORDER BY created_at DESC;"
```

### 3. Words দেখুন:
```bash
docker exec -it word-game-db psql -U postgres -d wordgame -c "SELECT w.id, w.word, w.hint, s.name as subject_name, w.is_active FROM words w LEFT JOIN subjects s ON w.subject_id = s.id ORDER BY w.created_at DESC LIMIT 20;"
```

### 4. Games দেখুন:
```bash
docker exec -it word-game-db psql -U postgres -d wordgame -c "SELECT id, title, correct_marks, difficulty, is_active, created_at FROM games ORDER BY created_at DESC;"
```

### 5. Players দেখুন:
```bash
docker exec -it word-game-db psql -U postgres -d wordgame -c "SELECT id, email, display_name, total_score, games_played, is_active, created_at FROM players ORDER BY created_at DESC LIMIT 20;"
```

### 6. Site Settings দেখুন:
```bash
docker exec -it word-game-db psql -U postgres -d wordgame -c "SELECT * FROM site_settings;"
```

### 7. Game Subjects (Game-Subject relationships) দেখুন:
```bash
docker exec -it word-game-db psql -U postgres -d wordgame -c "SELECT g.title as game_title, s.name as subject_name FROM game_subjects gs JOIN games g ON gs.game_id = g.id JOIN subjects s ON gs.subject_id = s.id;"
```

### 8. Game Stages দেখুন:
```bash
docker exec -it word-game-db psql -U postgres -d wordgame -c "SELECT gs.id, g.title as game_title, gs.title as stage_title, gs.order_index, gs.word_count FROM game_stages gs JOIN games g ON gs.game_id = g.id ORDER BY g.title, gs.order_index;"
```

## Interactive Mode (সব commands run করতে পারবেন):
```bash
docker exec -it word-game-db psql -U postgres -d wordgame
```

Interactive mode-এ গেলে:
- `\dt` - সব tables list
- `\d table_name` - specific table structure
- `SELECT * FROM table_name;` - table data দেখুন
- `\q` - exit

## Count দেখুন (কতগুলো data আছে):
```bash
# Total counts
docker exec -it word-game-db psql -U postgres -d wordgame -c "
SELECT 
  (SELECT COUNT(*) FROM admin_users) as admin_users,
  (SELECT COUNT(*) FROM subjects) as subjects,
  (SELECT COUNT(*) FROM words) as words,
  (SELECT COUNT(*) FROM games) as games,
  (SELECT COUNT(*) FROM players) as players;
"
```

