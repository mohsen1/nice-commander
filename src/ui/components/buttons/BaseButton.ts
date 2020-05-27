import styled from "styled-components";

export default styled.button`
  display: inline-block;
  min-width: 5rem;
  padding: 0.6rem 1rem;
  margin: 0.5rem 1rem;
  border-radius: 3px;
  border-width: 1px;
  font-size: 1.15rem;
  border-style: solid;
  border-color: ${({ theme }) => theme.colors.gray.light};
  color: ${({ theme }) => theme.colors.gray.dark};
  background-color: ${({ theme }) => theme.colors.gray.light};
`;
