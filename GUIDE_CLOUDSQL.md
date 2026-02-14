# Google Cloud SQL (PostgreSQL) 가이드

이 문서는 Django 애플리케이션을 위해 Google Cloud SQL (PostgreSQL) 인스턴스를 생성하고, 로컬 환경에서 Cloud SQL Auth Proxy를 사용하여 연결하는 방법을 설명합니다.

## 1. Google Cloud SQL 인스턴스 생성

1.  [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2.  **SQL** 메뉴로 이동합니다.
3.  **인스턴스 만들기**를 클릭합니다.
4.  database engine으로 **PostgreSQL**을 선택합니다.
5.  다음 정보를 입력하여 인스턴스를 설정합니다:
    -   **인스턴스 ID**: 원하는 ID (예: `study-scheduler-db`)
    -   **비밀번호**: 데이터베이스 `postgres` 사용자의 비밀번호 설정
    -   **데이터베이스 버전**: 최신 버전 (예: PostgreSQL 15)
    -   **Cloud SQL 버전**: 개발용으로는 **Enterprise** 에디션의 **Sandbox** 또는 **Shared core**를 추천합니다 (비용 절감).
    -   **리전**: 사용자와 가까운 리전 (예: `asia-northeast3` - 서울)
6.  **인스턴스 만들기**를 클릭하여 생성을 시작합니다. (몇 분 정도 소요됩니다.)

## 2. 데이터베이스 및 사용자 생성

인스턴스 생성이 완료되면:

1.  생성된 인스턴스 이름을 클릭하여 상세 페이지로 이동합니다.
2.  **데이터베이스** 탭으로 이동합니다.
    -   **데이터베이스 만들기**를 클릭합니다.
    -   데이터베이스 이름 (예: `study_scheduler`)을 입력하고 **만들기**를 클릭합니다.
3.  **사용자** 탭으로 이동합니다.
    -   기본 `postgres` 사용자를 사용하거나, **사용자 계정 추가**를 클릭하여 새 사용자를 생성합니다. (예: `scheduler_user`)

## 3. Cloud SQL Auth Proxy 설치 및 실행

로컬에서 Cloud SQL에 안전하게 연결하기 위해 Cloud SQL Auth Proxy를 사용합니다.

### 설치

**Linux (64-bit)**:

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
```

### 실행

1.  Google Cloud Console의 인스턴스 개요 페이지에서 **연결 이름**을 복사합니다. (형식: `project-id:region:instance-id`)
2.  터미널에서 프록시를 실행합니다:

```bash
./cloud-sql-proxy project-id:region:instance-id
```

성공적으로 실행되면 "Ready for new connections" 메시지가 표시됩니다. 이 터미널 창은 켜둔 상태로 유지하세요.

## 4. 환경 변수 설정

프로젝트 루트의 `.env` 파일을 생성하거나 수정하여 데이터베이스 연결 정보를 설정합니다.
(Django가 이 파일을 자동으로 읽도록 `python-dotenv`가 설치되어 있어야 합니다. `manage.py` 실행 시 로드하려면 `manage.py` 혹은 `wsgi.py` 에서 로드 코드를 추가하거나, 터미널에서 `export` 명령어를 사용해야 합니다.)

이 프로젝트는 `os.environ`을 사용하므로, 터미널에서 직접 설정하거나 `.env` 파일을 사용할 수 있습니다.

**터미널에서 실행 전 설정 (Linux/Mac):**

```bash
export DB_ENGINE=django.db.backends.postgresql
export DB_NAME=study_scheduler
export DB_USER=postgres  # 또는 생성한 사용자 이름
export DB_PASSWORD=설정한비밀번호
export DB_HOST=127.0.0.1
export DB_PORT=5432
```

## 5. 마이그레이션 및 실행

환경 변수가 설정된 상태에서 데이터베이스 마이그레이션을 수행합니다.

```bash
# 마이그레이션 (Cloud SQL에 테이블 생성)
python manage.py migrate

# 슈퍼유저 생성 (선택 사항)
python manage.py createsuperuser

# 서버 실행
python manage.py runserver
```

서버가 정상적으로 실행되면 Cloud SQL 데이터베이스를 사용하게 됩니다.


## 6. Cloud Run 배포 시 주의사항 (CSRF 에러 해결)

Cloud Run에 배포 후 로그인 시 `CSRF verification failed` 에러가 발생하면, `CSRF_TRUSTED_ORIGINS` 환경 변수를 설정해야 합니다.

**Cloud Run 환경 변수 설정:**

*   **키**: `CSRF_TRUSTED_ORIGINS`
*   **값**: `https://your-service-url.run.app` (여러 개일 경우 쉼표로 구분)

예를 들어, 서비스 URL이 `https://weekly-study-schedule-4542269301.europe-west1.run.app`라면:
`https://weekly-study-schedule-4542269301.europe-west1.run.app` 를 값으로 설정하세요.

## 참고: SQLite로 돌아가기

Cloud SQL 설정을 해제하고 로컬 SQLite를 다시 사용하려면, 설정했던 환경 변수를 해제하면 됩니다.

```bash
unset DB_ENGINE DB_NAME DB_USER DB_PASSWORD DB_HOST DB_PORT
```

또는 새로운 터미널 세션을 열면 환경 변수가 초기화되어 `settings.py`의 기본값인 SQLite로 동작합니다.
