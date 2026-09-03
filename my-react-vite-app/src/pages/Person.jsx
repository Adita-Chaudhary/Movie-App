import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersonDetails } from '../hooks/usePersonDetails';
import MovieRow from '../components/MovieRow';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import { tmdbImage } from '../services/tmdbClient';
import { buildFilmography, knownForMovies } from '../utils/personFilmography';
import { formatDate } from '../utils/format';
import '../css/Person.css';

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
    <div className="person-page">
      <div className="person-header">
        <div className="person-photo">
          {photoUrl ? (
            <img src={photoUrl} alt={person.name} />
          ) : (
            <div className="person-photo-placeholder" aria-hidden="true">
              👤
            </div>
          )}
        </div>

        <div className="person-info">
          <h1>{person.name}</h1>

          {person.known_for_department && <p className="person-department">{person.known_for_department}</p>}

          <dl className="person-facts">
            {person.birthday && (
              <div>
                <dt>Born</dt>
                <dd>
                  {formatDate(person.birthday)}
                  {age !== null && !person.deathday && ` (age ${age})`}
                </dd>
              </div>
            )}
            {person.deathday && (
              <div>
                <dt>Died</dt>
                <dd>
                  {formatDate(person.deathday)}
                  {age !== null && ` (age ${age})`}
                </dd>
              </div>
            )}
            {person.place_of_birth && (
              <div>
                <dt>Birthplace</dt>
                <dd>{person.place_of_birth}</dd>
              </div>
            )}
            {filmography.length > 0 && (
              <div>
                <dt>Filmography</dt>
                <dd>{filmography.length} movie{filmography.length === 1 ? '' : 's'} on record</dd>
              </div>
            )}
            {person.also_known_as?.length > 0 && (
              <div>
                <dt>Also known as</dt>
                <dd>{person.also_known_as.slice(0, 3).join(', ')}</dd>
              </div>
            )}
          </dl>

          <p className="person-biography">{person.biography?.trim() || 'No biography available.'}</p>
        </div>
      </div>

      {knownFor.length > 0 && <MovieRow title="Known For" movies={knownFor} isLoading={false} isError={false} />}

      {filmography.length > 0 && (
        <MovieRow
          title="Filmography"
          subtitle={`${filmography.length} movie${filmography.length === 1 ? '' : 's'}, most recent first`}
          movies={filmography}
          isLoading={false}
          isError={false}
        />
      )}

      {knownFor.length === 0 && filmography.length === 0 && <p className="person-no-credits">No known filmography available.</p>}
    </div>
  );
}

export default Person;
