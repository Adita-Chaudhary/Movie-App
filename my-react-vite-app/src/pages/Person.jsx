import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersonDetails } from '../hooks/usePersonDetails';
import MovieRow from '../components/MovieRow';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import PageContainer from '../components/PageContainer';
import Reveal from '../components/Reveal';
import { tmdbImage } from '../services/tmdbClient';
import { buildFilmography, knownForMovies } from '../utils/personFilmography';
import { formatDate } from '../utils/format';

function calculateAge(birthday, deathday) {
  if (!birthday) return null;
  const end = deathday ? new Date(deathday) : new Date();
  const start = new Date(birthday);
  let age = end.getFullYear() - start.getFullYear();
  const hasHadBirthdayThisYear =
    end.getMonth() > start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() >= start.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function Person() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { person, isLoading, isError, error } = usePersonDetails(id);

  const knownFor = useMemo(() => knownForMovies(person?.movie_credits), [person]);
  const filmography = useMemo(() => buildFilmography(person?.movie_credits), [person]);

  if (isLoading) return <Spinner label="Loading person details" />;
  if (isError) return <ErrorState message={error} onRetry={() => navigate(0)} />;
  if (!person) return null;

  const photoUrl = tmdbImage(person.profile_path, 'w342');
  const age = calculateAge(person.birthday, person.deathday);

  return (
    <PageContainer size="medium">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:gap-8 md:mb-10">
        <div className="mx-auto w-40 flex-none sm:mx-0 sm:w-[220px]">
          {photoUrl ? (
            <img
            src={photoUrl}
            alt={person.name}
            className="scale-in block w-full rounded-[10px] shadow-panel transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)]"
          />
          ) : (
            <div
              className="flex aspect-[2/3] w-full items-center justify-center rounded-[10px] bg-panel-raised text-5xl"
              aria-hidden="true"
            >
              👤
            </div>
          )}
        </div>

        <div className="stagger min-w-0 flex-1">
          <h1 className="fade-in-up mb-1 text-[clamp(1.6rem,4vw,2.2rem)] font-bold">{person.name}</h1>

          {person.known_for_department && (
            <p className="fade-in-up mb-4 font-semibold text-brand">{person.known_for_department}</p>
          )}

          <dl className="fade-in-up mb-6 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {person.birthday && (
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-ink-muted">Born</dt>
                <dd className="text-[0.95rem]">
                  {formatDate(person.birthday)}
                  {age !== null && !person.deathday && ` (age ${age})`}
                </dd>
              </div>
            )}
            {person.deathday && (
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-ink-muted">Died</dt>
                <dd className="text-[0.95rem]">
                  {formatDate(person.deathday)}
                  {age !== null && ` (age ${age})`}
                </dd>
              </div>
            )}
            {person.place_of_birth && (
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-ink-muted">Birthplace</dt>
                <dd className="text-[0.95rem]">{person.place_of_birth}</dd>
              </div>
            )}
            {filmography.length > 0 && (
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-ink-muted">Filmography</dt>
                <dd className="text-[0.95rem]">
                  {filmography.length} movie{filmography.length === 1 ? '' : 's'} on record
                </dd>
              </div>
            )}
            {person.also_known_as?.length > 0 && (
              <div>
                <dt className="mb-0.5 text-xs uppercase tracking-wide text-ink-muted">Also known as</dt>
                <dd className="text-[0.95rem]">{person.also_known_as.slice(0, 3).join(', ')}</dd>
              </div>
            )}
          </dl>

          <p className="fade-in-up whitespace-pre-line leading-relaxed">
            {person.biography?.trim() || 'No biography available.'}
          </p>
        </div>
      </div>

      {knownFor.length > 0 && (
        <Reveal>
          <MovieRow title="Known For" movies={knownFor} isLoading={false} isError={false} />
        </Reveal>
      )}

      {filmography.length > 0 && (
        <Reveal>
          <MovieRow
            title="Filmography"
            subtitle={`${filmography.length} movie${filmography.length === 1 ? '' : 's'}, most recent first`}
            movies={filmography}
            isLoading={false}
            isError={false}
          />
        </Reveal>
      )}

      {knownFor.length === 0 && filmography.length === 0 && (
        <p className="text-ink-muted">No known filmography available.</p>
      )}
    </PageContainer>
  );
}

export default Person;
