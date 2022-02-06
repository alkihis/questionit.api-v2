import {MigrationInterface, QueryRunner} from "typeorm";

export class FixAnswerContentToText1643918296459 implements MigrationInterface {
    name = 'FixAnswerContentToText1643918296459'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_token" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "application_token" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "questionit_application" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "questionit_application" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "last_login_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "relationship" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "relationship" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "push_message" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "push_message" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "block" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "block" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "like" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "like" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "answer" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "answer" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "answer" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "answer" ADD "content" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT 'now()'`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "updated_at" SET DEFAULT 'now()'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "answer" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "answer" ADD "content" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "answer" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "answer" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "like" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "like" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "block" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "block" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "push_message" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "push_message" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "relationship" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "relationship" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "last_login_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "questionit_application" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "questionit_application" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "application_token" ALTER COLUMN "updated_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
        await queryRunner.query(`ALTER TABLE "application_token" ALTER COLUMN "created_at" SET DEFAULT '2022-02-03 19:57:45.936011+00'`);
    }

}
