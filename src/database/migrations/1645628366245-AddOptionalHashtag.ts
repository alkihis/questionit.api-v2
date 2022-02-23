import {MigrationInterface, QueryRunner} from "typeorm";

export class AddOptionalHashtag1645628366245 implements MigrationInterface {
    name = 'AddOptionalHashtag1645628366245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "use_hashtag_in_questions" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "use_hashtag_in_questions"`);
    }

}
