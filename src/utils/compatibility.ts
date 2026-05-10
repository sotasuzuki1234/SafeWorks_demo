import type { Job, JobWithScore, UserConditions } from '../types'
import {
  calcJobScore,
  calcUserFit,
  calcWorkloadFit,
  calcCompatibility,
  calcDifficulty,
  getWhoFitsThis,
  getWhyHardForUser,
  isVideoEditingJob,
} from '../lib/calcCompatibility'
import { getJobTier } from './jobTags'

export { calcJobScore, calcUserFit, calcWorkloadFit, calcCompatibility, calcDifficulty, getWhoFitsThis, getWhyHardForUser, isVideoEditingJob }

export function buildJobsWithScore(jobs: Job[], conditions: UserConditions): JobWithScore[] {
  return jobs
    .map((job) => ({
      ...job,
      jobScore: calcJobScore(job),
      userFit: calcUserFit(job, conditions),
      workloadFit: calcWorkloadFit(job),
      compatibility: calcCompatibility(job, conditions),
      difficulty: calcDifficulty(job),
      whoFitsThis: getWhoFitsThis(job),
      whyHardReasons: getWhyHardForUser(job, conditions),
    }))
    .sort((a, b) => {
      const tierDiff = getJobTier(a.compatibility) - getJobTier(b.compatibility)
      if (tierDiff !== 0) return tierDiff
      return b.compatibility - a.compatibility
    })
}
