import {MigrationInterface, QueryRunner} from "typeorm";

export class MakePollUsableByAnon1645613526112 implements MigrationInterface {
    name = 'MakePollUsableByAnon1645613526112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "poll" DROP CONSTRAINT "FK_dbd9813b7ec48607f5468bc492f"`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "owner_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "poll" ADD CONSTRAINT "FK_dbd9813b7ec48607f5468bc492f" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "poll" DROP CONSTRAINT "FK_dbd9813b7ec48607f5468bc492f"`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "owner_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "poll" ADD CONSTRAINT "FK_dbd9813b7ec48607f5468bc492f" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
