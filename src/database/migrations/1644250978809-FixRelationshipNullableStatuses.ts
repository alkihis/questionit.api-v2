import {MigrationInterface, QueryRunner} from "typeorm";

export class FixRelationshipNullableStatuses1644250978809 implements MigrationInterface {
    name = 'FixRelationshipNullableStatuses1644250978809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "options" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_1bae0854035193fbb563f71a5cc"`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "receiver_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "blocked_words" SET DEFAULT jsonb_build_array()`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_1bae0854035193fbb563f71a5cc" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_1bae0854035193fbb563f71a5cc"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "blocked_words" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "receiver_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_1bae0854035193fbb563f71a5cc" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "options" DROP NOT NULL`);
    }

}
