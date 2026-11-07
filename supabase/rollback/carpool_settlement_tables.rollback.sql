-- carpool_settlement_tables 되돌리기 (수동 실행, 단일 트랜잭션). 데이터가 모두 삭제됩니다.
drop table if exists public.settlement_shares;
drop table if exists public.expenses;
drop table if exists public.carpool_passengers;
drop table if exists public.carpool_rides;
