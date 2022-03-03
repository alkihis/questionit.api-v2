import { Injectable, Logger } from '@nestjs/common';
import { MigrationMappingContext, MigrationTransactionContext, selectFromAlias } from '../v1.migration.utils';
import { Question } from '../../database/entities/question.entity';
import { Answer } from '../../database/entities/answer.entity';
import { Poll } from '../../database/entities/poll.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class V1MigrationQuestionService {
  async migrate() {
    Logger.log(`Starting question migration...`);
    const time = Date.now();

    const db = MigrationTransactionContext.db;
    const legacyDb = MigrationTransactionContext.legacy;

    // Prepare: Get questions & polls

    const questions = await legacyDb
      .createQueryBuilder()
      .select(selectFromAlias('q', [
        '_id AS id', 'created_at', 'content', 'seen', 'answer', 'answer_created_at', 'tweet_id', 'conversation_id',
        'realEmitter_id', 'emitter_id', 'receiver_id', 'inReplyTo_id', 'muted', 'emitter_ip', 'linked_image',
        'poll_id',
      ]))
      .from('question', 'q')
      .getRawMany();
    const polls = await legacyDb
      .createQueryBuilder()
      .select(selectFromAlias('p', [
        '_id AS id', 'created_at', 'option_1', 'option_2', 'option_3', 'option_4',
        'emitter_id', 'emitter_ip',
      ]))
      .from('poll', 'p')
      .getRawMany();

    const toInsert: Question[] = [];
    const repliesToLink: { question: Question, oldReplyToId: number }[] = [];
    const answersToInsert: { answer: Answer, question: Question, oldQuestion: any }[] = [];
    const pollsToInsert: { question: Question, poll: Poll }[] = [];

    for (const question of questions) {
      // -- QUESTION HANDLING --

      const oldRealEmitterId = question.realEmitter_id ? Number(question.realEmitter_id) : null;
      const oldEmitterId = question.emitter_id ? Number(question.emitter_id) : null;
      const oldReceiverId = question.receiver_id ? Number(question.receiver_id) : null;

      const newRealEmitterId = oldRealEmitterId ? MigrationMappingContext.map.users.get(oldRealEmitterId) : null;
      const newEmitterId = oldEmitterId ? MigrationMappingContext.map.users.get(oldEmitterId) : null;
      const newReceiverId = oldReceiverId ? MigrationMappingContext.map.users.get(oldReceiverId) : null;

      if (!newReceiverId) {
        Logger.error(`ERROR: For old question ${question.id}, receiver ${oldReceiverId} not found in new IDs!`);
        continue;
      }

      const item = db.getRepository(Question).create({
        createdAt: new Date(question.created_at),
        updatedAt: new Date(),
        content: question.content,
        seen: Number(question.seen) === 1,
        muted: Number(question.muted) === 1,
        tweetId: question.tweet_id,
        conversationId: question.conversation_id,
        emitterIp: question.emitter_ip,
        inReplyToQuestionId: null,
        privateOwnerId: newRealEmitterId,
        ownerId: newEmitterId,
        receiverId: newReceiverId,
        questionOfTheDayId: null,
      });

      // -- REPLY --

      if (question.inReplyTo_id) {
        repliesToLink.push({ question: item, oldReplyToId: Number(question.inReplyTo_id) });
      }

      // -- ANSWER --

      if (question.answer_created_at) {
        // Create answer
        const answer = db.getRepository(Answer).create({
          content: question.answer,
          createdAt: new Date(question.answer_created_at),
          updatedAt: new Date(),
          ownerId: newReceiverId,
          linkedImage: question.linked_image ? question.linked_image.slice('/questions/answer/'.length) : null,
          // TO ADD: questionId
          questionId: null,
        });

        answersToInsert.push({ answer, question: item, oldQuestion: question });
      }

      // -- POLL --

      if (question.poll_id) {
        const pollId = Number(question.poll_id);
        const poll = polls.find(p => Number(p.id) === pollId);

        if (poll) {
          const oldPollEmitterId = poll.emitter_id ? Number(poll.emitter_id) : null;
          const newPollEmitterId = oldPollEmitterId ? MigrationMappingContext.map.users.get(oldPollEmitterId) : null;

          // Create poll
          const newPoll = db.getRepository(Poll).create({
            createdAt: new Date(poll.created_at),
            updatedAt: new Date(),
            options: [poll.option_1, poll.option_2],
            ownerId: newPollEmitterId,
            emitterIp: poll.emitter_ip,
            // TO ADD: questionId
            questionId: null,
          });

          if (poll.option_3) {
            newPoll.options.push(poll.option_3);
          }
          if (poll.option_4) {
            newPoll.options.push(poll.option_4);
          }

          pollsToInsert.push({ poll: newPoll, question: item });
        } else {
          Logger.error(`ERROR: Unable to find poll ${pollId} for question ${question.id}.`);
        }
      }

      toInsert.push(item);
    }

    const questionInsertTime = Date.now();
    await db.getRepository(Question).save(toInsert);

    Logger.log(`Question migration: ${toInsert.length} questions inserted in ${Date.now() - questionInsertTime}ms.`);

    // Save oldQuestionId => newQuestionId
    let i = 0;
    for (const question of questions) {
      const newQuestion = toInsert[i];

      MigrationMappingContext.map.questions.set(Number(question.id), newQuestion.id);
      i++;
    }

    // -- ANSWERS --

    const answersInsertTime = Date.now();
    await this.migrateAnswers(answersToInsert);
    Logger.log(`Question migration: ${answersToInsert.length} answers inserted in ${Date.now() - answersInsertTime}ms.`);

    // -- POLLS --

    const pollInsertTime = Date.now();
    await this.migratePolls(pollsToInsert);
    Logger.log(`Question migration: ${pollsToInsert.length} polls inserted in ${Date.now() - pollInsertTime}ms.`);

    // -- REPLIES --

    const replyInsertTime = Date.now();
    await this.migrateReplies(repliesToLink);
    Logger.log(`Question migration: ${repliesToLink.length} replies linked in ${Date.now() - replyInsertTime}ms.`);

    // -- PINNED QUESTIONS --

    const pinnedInsertTime = Date.now();
    await this.migratePinnedQuestions();
    Logger.log(`Question migration: ${MigrationMappingContext.map.pinnedQuestionsToAttach.size} pinned questions attached in ${Date.now() - pinnedInsertTime}ms.`);

    Logger.log(`Migrated ${toInsert.length} questions in ${Date.now() - time}ms.`);
  }

  private async migrateAnswers(answersToInsert: { answer: Answer, question: Question, oldQuestion: any }[]) {
    const db = MigrationTransactionContext.db;

    for (const { question, answer } of answersToInsert) {
      if (!question.id) {
        Logger.error(`ERROR: Unable to attach ${question.content} to ${question.receiverId} to answer, because question doesn't have any ID.`);
        continue;
      }
      answer.questionId = question.id;
    }

    const answersToSave = answersToInsert.filter(a => a.answer.questionId);
    await db.getRepository(Answer).save(answersToSave.map(a => a.answer));

    // Save oldQuestionId => newAnswerId
    for (const { answer, oldQuestion } of answersToSave) {
      MigrationMappingContext.map.answers.set(Number(oldQuestion.id), answer.id);
    }
  }

  private async migratePolls(pollsToInsert: { question: Question, poll: Poll }[]) {
    const db = MigrationTransactionContext.db;

    for (const { question, poll } of pollsToInsert) {
      if (!question.id) {
        Logger.error(`ERROR: Unable to attach ${question.content} to ${question.receiverId} to poll, because question doesn't have any ID.`);
        continue;
      }
      poll.questionId = question.id;
    }

    const pollsToSave = pollsToInsert.map(a => a.poll).filter(a => a.questionId);
    await db.getRepository(Poll).save(pollsToSave);
  }

  private async migrateReplies(repliesToLink: { question: Question, oldReplyToId: number }[]) {
    const db = MigrationTransactionContext.db;

    // Handle in reply to question IDs
    for (const { question, oldReplyToId } of repliesToLink) {
      const newQuestionId = MigrationMappingContext.map.questions.get(oldReplyToId);

      if (!newQuestionId) {
        Logger.error(`ERROR: Unable to attach ${oldReplyToId} to ${question.id} reply, because in reply to question is not found.`);
        continue;
      }
      question.inReplyToQuestionId = newQuestionId;
    }

    await db.getRepository(Question).save(repliesToLink.map(q => q.question));
  }

  private async migratePinnedQuestions() {
    const db = MigrationTransactionContext.db;

    for (const [oldUserId, oldQuestionId] of MigrationMappingContext.map.pinnedQuestionsToAttach) {
      const newUserId = MigrationMappingContext.map.users.get(oldUserId);
      const newQuestionId = MigrationMappingContext.map.questions.get(oldQuestionId);

      if (!newUserId) {
        Logger.error(`ERROR: Unable to attach pinned question ${oldQuestionId} to ${oldUserId}, because new user ID is not found.`);
        continue;
      }
      if (!newQuestionId) {
        Logger.error(`ERROR: Unable to attach pinned question ${oldQuestionId} to ${oldUserId}, because new question ID is not found.`);
        continue;
      }

      await db.getRepository(User)
        .update({ id: newUserId }, { pinnedQuestionId: newQuestionId });
    }
  }
}
