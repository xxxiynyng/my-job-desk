#!/bin/sh
# /검수 슬래시 명령을 서버에 등록한다(한 번만). 필요: DISCORD_APP_ID, DISCORD_GUILD_ID, DISCORD_BOT_TOKEN 환경변수.
curl -sS -X PUT "https://discord.com/api/v10/applications/$DISCORD_APP_ID/guilds/$DISCORD_GUILD_ID/commands" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" -H "Content-Type: application/json" \
  -d '[{"name":"검수","description":"검수 목록 번호와 값을 보냅니다 (예: 1 정규직, 2 미분류)","type":1,
        "options":[{"name":"답","description":"예: 1 정규직, 2 미분류, 3 숨김, 4 경력 신입","type":3,"required":true}]}]'
