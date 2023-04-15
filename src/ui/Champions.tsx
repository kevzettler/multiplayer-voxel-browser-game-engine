import React, { SyntheticEvent } from 'react';
import Header from "./Header";
import CharacterView from './Equip/CharacterView';
import styles from './styles/Equip.css';
import { useTable } from 'react-table';
import ContainerDimensions from 'react-container-dimensions'

const columns = [
    {
      Header: "Title",
      accessor: 'title'
    },

    {
      Header: "Streak",
      id: 'streak',
      accessor: () => "10 Days"
    },

    {
      Header: "Player Name",
      accessor: 'userName'
    },

    {
      Header: "Region",
      id: 'region',
      accessor: () => "US-East"
    },
  ];



export default function Champions(){
  const [champions, setChampions] = React.useState([]);
  const [activeChampIdx, setActiveChampIdx] = React.useState(0);

  React.useEffect(() => {
    function fetchChampions(){
      window.setTimeout(() => {
        setChampions([
            {
              id: 'ServerDaemon',
              userName: 'ServerDaemon',
              skeleton: 'mechSniperActions',
              title: "Universal Champion",
              palette: [
                {r:1,g:1,b:0.403921568627451,a:1},
                {r:0,g:0,b:0,a:1},
                {r:0.4588235294117647,g:0.4588235294117647,b:0.27450980392156865,a:1},
                {r:0.9803921568627451,g:0.9764705882352941,b:0.4196078431372549,a:1},
                {r:0.7490196078431373,g:0.09019607843137255,b:0.6039215686274509,a:1}
              ],
              items: {
                head: 'geordiHead',
                core: 'standardCore',
                arms: 'standardArms',
                legs: 'standardLegs',
                booster: 'wingBooster',
                weapon: 'standardSword',
              },
            },

            {
              id: 'ServerDaemon',
              userName: localStorage.getItem('userName') || '',
              title: "AnimeCon Champion",
              skeleton: 'mechSniperActions',
              palette: JSON.parse(localStorage.getItem('palette')) ||
                       [{"r":0.26666666666666666,"g":0.26666666666666666,"b":0.26666666666666666,"a":1},{"r":0.8313725490196079,"g":0.41568627450980394,"b":0.050980392156862744,"a":1},{"r":0.4666666666666667,"g":0.5882352941176471,"b":0.6039215686274509,"a":1},{"r":1,"g":1,"b":1,"a":1}],

              items:  JSON.parse(localStorage.getItem('items')) || {
                head: 'standardHead',
                core: 'standardCore',
                arms: 'standardArms',
                legs: 'standardLegs',
                booster: 'standardBooster',
                weapon: 'standardGun',
              },
            },
          ])
      })
    }

    fetchChampions();
  }, [])

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable({ columns, data: champions})

  const champ = champions[activeChampIdx];


  if(!champ) return null;

  return (
    <div>
      <Header/>
      <div className={styles.championViewContainer}>
        <CharacterView
          items={champ.items}
          palette={champ.palette}
        />
      </div>

      <div className={styles.championListContainer}>
        <table {...getTableProps()} className={styles.champTable}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()}>
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, idx) => {
              prepareRow(row)
              return (
                <tr {...row.getRowProps()}
                    onClick={() => {
                      setActiveChampIdx(idx)
                    }}
                    style={{
                      background: idx === activeChampIdx ? '#00afec' : 'white',
                      color: idx === activeChampIdx ? 'white' : 'black'
                    }}>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}>
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
    </div>
  );
}
