import { Item, RoleType } from '@prisma/client';

interface QuestionContent {
  questionType: string;
  text: string;
  required: boolean;
  options?: Array<{ id: string; text: string }>;
  correctAnswers?: string[];
  points?: number;
  scaleMin?: number;
  scaleMax?: number;
  explanation?: string;
}

/**
 * SECURITY CRITICAL: Strip correctAnswers and explanation from
 * QUESTION items when the requesting user has RESPONDENT role only.
 * CREATOR, REVIEWER, TENANT_ADMIN, SUPER_ADMIN see all fields.
 */
export function serializeItem(item: Item, userRoles: RoleType[]): Item {
  if (item.type !== 'QUESTION') return item;

  const isRespondentOnly =
    userRoles.every((r) => r === RoleType.RESPONDENT) ||
    (userRoles.includes(RoleType.RESPONDENT) &&
      !userRoles.includes(RoleType.CREATOR) &&
      !userRoles.includes(RoleType.REVIEWER) &&
      !userRoles.includes(RoleType.TENANT_ADMIN) &&
      !userRoles.includes(RoleType.SUPER_ADMIN));

  if (!isRespondentOnly) return item;

  const content = { ...(item.content as unknown as QuestionContent) };
  delete content.correctAnswers;
  delete content.explanation;

  return { ...item, content };
}

export function serializeItems(items: Item[], userRoles: RoleType[]): Item[] {
  return items.map((item) => serializeItem(item, userRoles));
}
