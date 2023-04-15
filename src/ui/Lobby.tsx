import React from 'react';
import Header from "./Header.jsx";
import { useTable } from 'react-table';
import 'react-table/react-table.css';
import { Link } from 'react-router-dom'

export default function Lobby(){
  const [servers, setServers] = React.useState([])

  React.useEffect(() => {
    function fetchServers(){
      window.setTimeout(() => {
        setServers([
          {
            id: 'devserver',
            name: "Dev Server",
            hostuser: "Kev",
            desc: "Crazy Experimental gameplay development going down in here",
            players: [1, 10],
            ping: 600
          }
        ])
      })
    }

    fetchServers()
  }, [])

  if(!this.state.servers || !this.state.servers.length){
    return <p>fetching game servers...</p>;
  }

  const columns = React.useMemo(
    () =>[
      {
        Header: "Join",
        id: "playbtn",
        Cell: () => <Link to="/play"><button>Play</button></Link>
      },
      {
        Header: 'Server Name',
        accessor: 'name'
      },
      {
        Header: 'Host User',
        accessor: 'hostuser'
      },
      {
        Header: 'Description',
        accessor: 'desc'
      },
      {
        Header: 'Players',
        id: 'playerCount',
        accessor: (d:any) => `${d.players[0]}/${d.players[1]}`
      },
      {
        Header: 'ping',
        accessor: 'ping'
      }
    ],
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable({ columns, data: servers})

  return (
    <div>
      <Header/>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps()}
                >
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return (
                    <td
                      {...cell.getCellProps()}
                    >
                      {cell.render('Cell')}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}
