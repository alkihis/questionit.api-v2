import {MigrationInterface, QueryRunner} from "typeorm";

export class AddExpiresAtForTokens1646293876111 implements MigrationInterface {
    name = 'AddExpiresAtForTokens1646293876111'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "expires_at"`);
    }

}
