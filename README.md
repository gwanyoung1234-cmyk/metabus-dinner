# 메타버스 회식방

넓은 홀에 테이블을 깔고, 앉아서 건배하는 **실시간 멀티플레이** 회식 시뮬레이터입니다.  
결제·시세·경제 시스템은 없습니다. 그냥 회식입니다.

## 스택

- Next.js (App Router) + TypeScript + Tailwind CSS
- React Three Fiber / drei / three
- Socket.IO (presence: 입장, 좌석, 액션, 2차 투표)

## 실행 (로컬)

```bash
npm install
npm run dev
```

- 로컬: [http://localhost:3000](http://localhost:3000) (웹 + Socket.IO 통합)

임시 공개(PC 켜져 있을 때만):

```bash
npm run tunnel
```

## PC 꺼져 있어도 접속 (클라우드 배포)

Socket.IO가 필요해서 **Vercel만으로는 안 됩니다.** Render / Railway 같은 Node 서버에 올립니다.

1. 이 프로젝트를 GitHub에 푸시
2. [Render](https://render.com) → New → Web Service → 저장소 연결
3. Build: `npm ci && npm run build`
4. Start: `npx tsx server/combined.ts`
5. 발급된 `https://….onrender.com` 주소를 공유

`render.yaml` 파일이 있으면 Blueprint로도 생성할 수 있습니다.

## 조작

| 버튼 | 설명 |
|------|------|
| 앉기 / 일어서기 | 가운데에 가까운 빈 자리 자동 배정 |
| 건배 | 전역 토스트 라인 + 건배왕 집계 |
| 따르기 / 안주 | 짧은 액션 연출 + 스테이지 메시지 |
| 2차 투표 | 과반이 되면 결과는… 거의 항상 2차 |

팀장님 NPC는 **로컬 전용** 개그 캐릭터라 다른 브라우저와 동기화되지 않습니다.

## 환경 변수

`.env.example` 참고:

- `NEXT_PUBLIC_SOCKET_URL` — 클라이언트 Socket URL (기본 `http://localhost:3001`)
- `SOCKET_PORT` — 서버 포트 (기본 `3001`)
- `CORS_ORIGIN` — 허용 Origin (기본 `http://localhost:3000`)
