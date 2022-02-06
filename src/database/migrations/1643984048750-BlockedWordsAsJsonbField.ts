import {MigrationInterface, QueryRunner} from "typeorm";

export class BlockedWordsAsJsonbField1643984048750 implements MigrationInterface {
    name = 'BlockedWordsAsJsonbField1643984048750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "blocked_words"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "blocked_words" jsonb NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "blocked_words"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "blocked_words" text NOT NULL`);
    }

}
