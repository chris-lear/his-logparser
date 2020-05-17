var game;
var Game = {};
var Setup={};

var Powers = {
    'ottoman':"The Ottomans",
    'hapsburg':"The Hapsburgs",
    'england':"England",
    'france':"France",
    'pope':"The Papacy",
    'protestant':"The Protestants",
    'independent': 'The Independents',
    'total': 'Total'
};

Setup.currentBattle = null;
Setup.currentTurn = 0;
Setup.currentImpulse = 0;
Setup.currentPlayer = 0;
Setup.Battles = [];
Setup.Explorers = [];
Setup.Conquistadors = [];
Setup.Reformations=[];
Setup.CounterReformations=[];
Setup.Turns=[
{'ottoman':[],'hapsburg':[],'england':[],'france':[],'pope':[],'protestant':[]},
{'ottoman':[],'hapsburg':[],'england':[],'france':[],'pope':[],'protestant':[]},
{'ottoman':[],'hapsburg':[],'england':[],'france':[],'pope':[],'protestant':[]},
{'ottoman':[],'hapsburg':[],'england':[],'france':[],'pope':[],'protestant':[]},
{'ottoman':[],'hapsburg':[],'england':[],'france':[],'pope':[],'protestant':[]},
{'ottoman':[],'hapsburg':[],'england':[],'france':[],'pope':[],'protestant':[]},
{'ottoman':[],'hapsburg':[],'england':[],'france':[],'pope':[],'protestant':[]},
{'ottoman':[],'hapsburg':[],'england':[],'france':[],'pope':[],'protestant':[]}
];
Setup.ReformationDice = {'protestant':[0,0,0,0,0,0,0],'pope':[0,0,0,0,0,0,0]};
Setup.DebateDice = {'protestant':[0,0,0,0,0,0,0],'pope':[0,0,0,0,0,0,0]};
Setup.BattleDice = {'ottoman':[0,0,0,0,0,0,0],
    'hapsburg':[0,0,0,0,0,0,0],
    'england':[0,0,0,0,0,0,0],
    'france':[0,0,0,0,0,0,0],
    'pope':[0,0,0,0,0,0,0],
    'protestant':[0,0,0,0,0,0,0],
    'independent':[0,0,0,0,0,0,0]
};
Battle = function(b) {
    Object.assign(this,JSON.parse(JSON.stringify(b)));
    if (this.type=='Diet') {
        this.initiator='pope';
    }
    this.dice = [];
    this.addDice = (who, what) => {
        if (!this.dice[who]) {
            this.dice[who] = [0,0,0,0,0,0,0];
        }
        this.dice[who][what]++;
    }
    this.initiatorName = function() {
        return Powers[this.initiator];
    }
    this.winnerName = function() {
        return Powers[this.winner];
    }
    this.loserName = function() {
        return Powers[this.loser];
    }
    this.description = function() {
        switch (this.type) {
            case 'Field Battle':
            return `Battle of ${this.location}`;
            break;
            case 'Naval':
            return `(${this.type}) Battle of ${this.location}`;
            break;
            case 'Assault':
            return `Siege of ${this.location}`;
            break;
            case 'Foreign War':
            return `Foreign war in ${this.location}`;
            case 'Debate':
            return `Debate in ${this.location}`;
            case 'Diet':
            return `Diet of Worms`
            case 'Exploration':
            return `${this.winner} Discovers ${this.location}`;
            case 'Conquest':
            return `${this.winner} Conquers ${this.location}`;
            default:
            console.log('unknown battle type '+this.type);
        }
        return `${this.type} in ${this.location}`
    }
    this.class = function() {
        return this.type.toLowerCase().replace(/ /g,'-');
    }
    this.getDate = function() {
        if (this.type=='Diet') {
            return 'Jan-May 1521';
        }
        return game.date(this.turn,this.impulse);
    }
    this.getDice = function(which) {
        var out = '';
        dChars = ['','⚀','⚁','⚂','⚃','<span class="hit">⚄</span>','<span class="hit">⚅</span>'];
        var thing = this.dice[this.loser];
        if (which == 'winner') {
            thing = this.dice[this.winner];
        }
        if (!thing) {
            return '';
        }
        thing.forEach((d,i)=>{out+=dChars[i].repeat(d)});
        return out;
    }
    this.getWinnerDice = function() {
        return this.getDice('winner');
    }
    this.getLoserDice = function() {
        return this.getDice('loser');
    }
}
Game.reformation = function(location, result, type) {

    if (type=="counter ") {
        thing = this.CounterReformations;
    } else {
        thing = this.Reformations;
    }
    if (!thing[location]) {
        thing[location]={success:0,fail:0};
    }
    thing[location]
    if (result=='succeeds!') {
        thing[location].success++;
    } else {
        thing[location].fail++;
    }
}
Game.reformationDice = function(who, what) {
    var g = this;
    var dice = what.split(/\s*,\s*/);
    $(dice).each(function() {
        g.ReformationDice[who][this]++;
    });
}
Game.debateDice = function(who, what) {
    var g = this;
    var dice = what.split(/\s*,\s*/);
    $(dice).each(function() {
        g.DebateDice[who][this]++;
    });
}
Game.hitDice = function(who, what, hits) {
    if (!what) {
        return;
    }
    var g = this;
    var dice = what.split(/\s*,\s*/);
    $(dice).each(function() {
        g.BattleDice[who][this]++;
        if (g.currentBattle) {
            g.currentBattle.addDice(who,this);
        }
    });
}
Game.addTurn = function(turn, who, impulseNumber, type, num, ops) {
    this.Turns[turn][who].push({'ops':+ops, 'type':type, 'cardNumber':+num});
    this.currentTurn = +turn;
    this.currentImpulse = +impulseNumber;
    this.currentPlayer = who;
}
Game.addBattle = function(text, type, where, winner, other) {
    var loser;
    var initiator = this.currentPlayer;
    switch (winner) {
    case 'is successful':
        winner = this.currentPlayer;
        loser = other;
    break;
    case 'fails':
        loser = this.currentPlayer;
        winner = this.power(other);
    break;
    default:
        loser = other;
    }
    if (type=='Debate'||type=='Diet') {
        loser = ['protestant','pope'].filter(item=>item!=winner)[0];
    }
    if (type=='Exploration') {
        initiator = game.Explorers[winner];
    }
    if (type=='Conquest') {
        initiator = game.Conquistadors[winner];
    }
    this.currentBattle = new Battle({
        'turn': this.currentTurn,
        'impulse': this.currentImpulse,
        'initiator': initiator,
        'type': type,
        'location': where,
        'winner': winner,
        'loser':loser,
        'text':text
    });
    this.Battles.push(this.currentBattle);
}
Game.power= function(text) {
    if (!text) {
        return;
    }
    text = text.replace(/\s*Tercios\s*/,'');
    var powers = {
    'The Ottomans':'ottoman',
    'Ottoman':'ottoman',
    'The Hapsburgs':'hapsburg',
    'Hapsburg':'hapsburg',
    'Hapsburgs':'hapsburg',
    'England':'england',
    'France':'france',
    'English':'england',
    'French':'france',
    'The Catholics':'pope',
    'The Papacy':'pope',
    'Protestant':'protestant',
    'Protestant Diet of Worms':'protestant',
    'Catholic Diet of Worms':'pope',
    'The Protestants':'protestant',
    'Papal':'pope',
    'Anti-Piracy':'hapsburg',
    'Ottoman Piracy':'ottoman',
    'Persia':'independent',
    'Persian':'independent',
    'Hungarian/Bohemian':'independent',
    'Hungary/Bohemia':'independent',
    'Independent':'independent',
    'Scotland':'independent',
    'Scottish':'independent',
    'The Independents':'independent',
    'independent':'independent',
};
    if (powers[text]) {
        return powers[text];
    } else {
        console.log(text);
        return "independent";
    }
}
Game.extract = function(power) {
    var ret = {
        count:function(dice) {
                  if (!dice) {
                      return 0;
                  }
            return dice.reduce((a,c)=>a+=c);
        }
    };
    ret.battleDice = this.BattleDice[power];
    ret.debateDice = this.DebateDice[power];
    ret.reformationDice = this.ReformationDice[power];
    ret.totalDice = ret.count(ret.debateDice)+ret.count(ret.reformationDice)+ret.count(ret.battleDice);
    ret.allDice = addvector(addvector(ret.battleDice,ret.debateDice),ret.reformationDice);
    ret.allDiceText = ret.allDice.reduce((a,c,i)=>{if (!i) return ''; return a+' ' + c + ' '+ i + 's';},'');
    ret.hits = ret.allDice.reduce((a,c,i)=>{if (i>4) {return a+=c;} else return a;},0);
    ret.hitsPerc = ret.hits/ret.totalDice||0;
    ret.diceTotal = ret.allDice.reduce((a,c,i)=>{if(!i)return 0; return a+(c*i);},0);
    ret.averageDice = ret.diceTotal/ret.totalDice||0;
    var cards = this.Turns.map(x=>x[power]).filter(x=>x);
    ret.cards = [].concat(...cards);
    ret.cardcount = ret.cards.length;
    ret.ops = ret.cards.reduce((acc,curr)=>acc+curr.ops, 0);
    ret.battlesInitiated = this.Battles.reduce((acc,curr)=>{return (curr.initiator==power)?acc+1:acc;},0)
    ret.battlesWon = this.Battles.reduce((acc,curr)=>{return (curr.winner==power)?acc+1:acc;},0)
    ret.battlesLost = this.Battles.reduce((acc,curr)=>{return (curr.loser==power)?acc+1:acc;},0)
    if (ret.ops) {
        ret.averageOps = ret.ops/ret.cards.length;
    } else {
        ret.averageOps = 0;
    }
    return ret;
}
Game.date = function(turn,impulse) {
        var baseYear = 1516 + turn*4;
        var month = Math.floor(impulse*4*12/this.maxImpulse(turn));
        var year = Math.floor(month/12);
        month = month%12;
        const date = new Date(2009, month, 10);  // 2009-11-10
        month = date.toLocaleString('default', { month: 'long' });
        return month + " " + (baseYear+year);
/*
October 1517
Jan-May 1521
1523
1524-1527
1528-1531
1532-1535
1536-1539
1540-1543
1544-1547
1548-1551
1552-1555
*/
}
Game.maxImpulse = function(turn) {
    var max=0;
    for (var power in this.Turns[turn]) {max=this.Turns[turn][power].length>max?this.Turns[turn][power].length:max;};
    return max;
}

G = function(){
    
    Object.assign(this,JSON.parse(JSON.stringify(Setup)));
};
G.prototype = Game;
function addvector(a,b){
    if (!a&&!b) {
        return [];
    }
    if (!b){return a;};
    if(!a) return b;
    return a.map((e,i) => e + b[i]);
}

function update(e) {
    game = new G();
    var t = $('#input').val();
    var turns = t.split(/\*\* Start of Turn \d \*\*/)
        turns.shift();

    $(turns).each(function() {
        $(this.match(/\*\*.*?Phase \*\*[\s\S]*?(?=(\*\*.*?Phase \*\*)|$)/g)).each(function() {
            parsePhase(this);
        });
    });
    console.log(game);

    total = game.extract('');
    powers = ['protestant','pope','hapsburg','england','france','ottoman','independent','total'];
    $('#stats tbody tr').remove();
    powers.forEach(power=>{
        var data = game.extract(power);
        total.cardcount+=data.cardcount;
        total.ops+=data.ops;
        total.averageOps = total.ops/total.cardcount;
        total.totalDice += data.totalDice;
        total.diceTotal += data.diceTotal;
        total.averageDice = total.diceTotal/total.totalDice;
        total.battlesInitiated+= data.battlesInitiated;
        total.hits+=data.hits;
        total.hitsPerc=total.hits/total.totalDice;
        
        if (power=='total') {
            data = total;
            data.battlesWon = data.battlesLost = data.battlesInitiated;
        }
        $('#stats tbody').append(
                `<tr id='${power}' class='stats-row'>
                <td ><span class='power ${power}'>${Powers[power]}</span></td>
                <td class='cards-played'>${data.cards.length}</td>
                <td class='total-ops'>${data.ops}</td>
                <td class='average-ops'>${data.averageOps.toFixed(2)}</td>
                <td class='total-dice' title='${data.allDiceText}'>${data.totalDice}</td>
                <td class='average-dice'>${data.averageDice.toFixed(2)}</td>
                <td class='hits'>${data.hits}</td>
                <td class='hits-percentage'>${(data.hitsPerc*100).toFixed(2)}</td>
                <td class='battles-initiated'>${data.battlesInitiated}</td>
                <td class='battles-won'>${data.battlesWon}</td>
                <td class='battles-lost'>${data.battlesLost}</td>
                </tr>`);

        var overview = $(`
            <table class='pure-table ${power} overview'>
            <thead>
                <tr>
                <th>${Powers[power]}</th>
                </tr>
                </thead>
                <tbody class='stats'>
            </tbody>
            </table>`);
        $('#overviews').append(overview);
    });
    $('#battles').empty();
    game.Battles.forEach(battle=>{
        $('#battles').append($(`<tr class='battle ${battle.winner} ${battle.loser} ${battle.initiator}'>

        <td><span class='date' title='Turn ${battle.turn} Impulse ${battle.impulse}'>${battle.getDate()}</span></td>
        <td><span class='initiator power ${battle.initiator}'>${battle.initiatorName()}</span></td>
        <td><span class='battleDesc ${battle.class()}' title='${battle.text}'> ${battle.description()}</span></td>
        <td><span class='winner power ${battle.winner}'>${battle.winnerName()}</span><br/><span class='dice winner-dice'>${battle.getWinnerDice()}</span></td>
        <td><span class='loser power ${battle.loser}'>${battle.loserName()}</span><br/><span class='dice loser-dice'>${battle.getLoserDice()}</span></td>
        </tr>`));
    });
}

function parsePhase(phase) {
    var name = phase.match(/\*\* (.*?) \.*?Phase *\*/)[1];
    switch(name) {
        case "Luther's 95 Thesis":
        parseTheses(phase);
            break;
        case "Action":
        parseAction(phase);
            break;
        case "Card Draw":
            break;
        case "Diet of Worms":
        parseDiet(phase);
            break;
        case "Diplomacy":
            break;
        case "New World":
        parseNewWorld(phase);
            break;
        case "Spring Deployment":
            break;
        case "Winter":
        parseWinter(phase);
            break;
        default:
            console.log(name + ' not implemented');
    }
}

function parseDebateDice(text) {
    dice1 = text.match(/Protestant .*dic?e roll: (.*?) --/);
    game.debateDice('protestant',dice1[1]);
    dice2 = text.match(/Catholic .*dic?e roll: (.*?) --/);
    game.debateDice('pope',dice2[1]);
    
}
function parseDiet(text) {
    var winner = text.match(/(.*) win the Diet of Worms/);
    if (winner) {
        winner = winner[1];
    } else {
        winner = 'pope';// not true
    }
    game.addBattle(text,'Diet',"Worms",'pope',game.power(winner));
    parseHits(text);
}
function parseReformations(text) {
    refs = text.match(/(?:Counter )?Reformation attempt in [\s\S]*?The (?:counter )?reformation roll in .*/g);
    $(refs).each(function() {
        parseReformation(this);
    });

}
function parseReformation(text) {
    ref = text.match(/(?:Counter )?Reformation attempt in (.*?)\n[\s\S]*?The (counter )?reformation roll in \1 (.*) \*\*/);
    game.reformation(ref[1],ref[3],ref[2]);
    parseReformationDice(text);
}

function parseReformationDice(text) {
    dice1 = text.match(/Protestant dic?e roll: (.*?) --.*high roll/);
    if (dice1) {
        game.reformationDice('protestant',dice1[1]);
    }
    dice2 = text.match(/Catholic dic?e roll: (.*?) --.*high roll/);
    if (dice2) {
        game.reformationDice('pope',dice2[1]);
    }
    
}


function parseTheses(text) {
    parseReformations(text);
}

function parseImpulse(text) {
    var powers={'Ottoman':'ottoman','Hapsburg':'hapsburg','English':'england','French':'france','Papal':'pope','Protestant':'protestant'};
    var whowhich = text.match(/Turn (\d), (\w*) (\d*).*impulse/);
    var turn = whowhich[1];
    var who = powers[whowhich[2]];
    var impulseNumber=whowhich[3];
    card = text.match(/.*plays? the following card (.*?):[\s\S]*?#(\d*) -\s*Ops (\d)/);
    if (!card) {
        return;
    }
    var type=card[1];
    var num=card[2];
    var ops=card[3];
    var types = {"for Command Points":'CPs',"as an Event":'Event',"as a Mandatory Event":'Mandatory'}
    game.addTurn(turn, who, impulseNumber, types[type], num, ops);
    game.currentBattle = null;
    parseReformations(text);
    parseBattles(text);
    // TODO multiple battles in one impulse
}

function parseBattles(text) {
    /*
    ** Battle of Boulogne **
  (response cards)

French dice: 7 SPs +1(Francis I) = 8 dice
English dice: 3 SPs +1(Henry VIII) +1(defending) = 5 dice
  (combat cards)

** France dice roll: 1, 6, 2, 1, 1, 3, 6, 2 -- 2 hits **
** England dice roll: 4, 2, 2, 5, 5 -- 2 hits **
*/



/*


The Ottomans spend 1 CP to fight a foreign war

    ** Battle of Persia **
      (response cards)

      Ottoman dice: 5 SPs +2(Suleiman I) = 7 dice
      Persian dice: 4 SPs = 4 dice
        (combat cards)

        ** The Ottomans dice roll: 5, 5, 3, 2, 1, 3, 1 -- 2 hits **
        ** Persia dice roll: 1, 6, 6, 1 -- 2 hits **
        Rebel forces for the War with Persia now at 2 SPs

        */

    var assault = text.match(/\*\* Assault of (.*)\*\*[\s\S]*?(.*?) dic?e.*\(defending\)[\s\S]*?assault in \1 (.*)!/g);
	$(assault).each(function() {
        game.currentBattle = null;
        parseAssault(this);
        parseHits(this);
    });

    var battle = text.match(/\*\* Battle of (.*) \*\*[\s\S]*?(.*?) dic?e: [\s\S]*?(.*?) dic?e: [\s\S]*?\s\s*(.*?) wins? the battle of *\1/g);
    $(battle).each(function() {
        game.currentBattle = null;
        parseFieldBattle(this);
        parseHits(this);
    });

    var foreignWar = text.match(/to fight a foreign war[\s\S]*?\*\* Battle of (.*) \*\*[\s\S]*?(.*?) dic?e: [\s\S]*?(.*?) dic?e: [\s\S]*?War with \1/g);
    $(foreignWar).each(function() {
        game.currentBattle = null;
        parseForeignWar(this);
        parseHits(this);
    });

    /*
    ** Naval Combat in Barbary Coast, The Ottomans vs. The Hapsburgs **
Ottoman dice: 6(1 squadron, 4 corsairs) +2(Barbarossa) = 8 dice
Hapsburg dice: 2(1 squadron) = 2 dice

** Ottoman dice roll: 4, 1, 2, 5, 1, 6, 1, 4 -- 2 hits **
** Hapsburg dice roll: 5, 6 -- 2 hits **
The Hapsburgs win the naval battle in Barbary Coast!
*/
    
    var naval = text.match(/\*\* Naval Combat in (.*?)[\s\S]*? win the naval battle in .*/g);
    $(naval).each(function() {
        game.currentBattle = null;
        parseNavalBattle(this);
        parseHits(this);
    });
/*
The Papacy calls a debate in the German language zone
     Papal debater: Contarini(2) (specifically chosen due to Leipzig Debate)
    Protestant debater: Bullinger(2)  (randomly selected from the committed debaters)
Papal dice: 2(Contarini), +3(attacking) = 5 dice
Protestant dice: 2(Bullinger), +1(defending while committed) = 3 dice

** Papal dice roll: 1, 2, 1, 5, 3 -- 1 hit
** Protestant dice roll: 1, 4, 5 -- 1 hit

The debate score is tied--there will be another round of debating!

The Papal debater randomly selected for the second round is Tetzel
The Protestant debater randomly selected for the second round is Melanchthon
Papal dice: 1(Tetzel), +3(attacking) = 4 dice
Protestant dice: 3(Melanchthon), +2(defending while uncommitted) = 5 dice

** Papal dice roll: 3, 4, 5, 6 -- 2 hits
** Protestant dice roll: 4, 4, 1, 4, 4 -- 0 hits

The Papacy wins the debate, 2 to 0
    Trier converted to Catholic control
    Worms converted to Catholic control
*/

    var debates = text.match(/.*calls? a debate[\s\S]*?wins? the debate.*/g);
    $(debates).each(function() {
        game.currentBattle = null;
        parseDebate(this);
        parseHits(this);
    });


}

function parseDebate(text) {
    var debate = text.match(/(.*) calls? a debate in the (.*) language zone[\s\S]*?(.*) wins? the debate.*/);
    if (debate) {
        game.addBattle(debate[0],'Debate',debate[2],game.power(debate[3]));
    }
}

function parseAssault(text) {
    var assault = text.match(/\*\* Assault of (.*)\*\*[\s\S]*?(.*?) dic?e.*\(defending\)[\s\S]*?assault in \1 (.*)!/);
    if (assault) {
        game.addBattle(assault[0],'Assault',assault[1],assault[3],game.power(assault[2]));
    }
}
function parseFieldBattle(text) {
    var battle = text.match(/\*\* Battle of (.*) \*\*[\s\S]*?(.*?) dic?e: [\s\S]*?(.*?) dic?e: [\s\S]*?\s\s*(.*?) wins? the battle of *\1/);
    if (battle) {
        loser = [game.power(battle[2]),game.power(battle[3])].filter(item=>item!=game.power(battle[4]))[0];
        game.addBattle(battle[0],'Field Battle',battle[1],game.power(battle[4]),loser);
    }
}
function parseNavalBattle(text) {
    naval = text.match(/\*\* Naval Combat in (.*?), (.*) vs\. (.*?) \*\*[\s\S]*?(.*?) win the naval battle in \1/);
    if (naval) {
        loser = [naval[2],naval[3]].filter(item=>item!=naval[4])[0];
        game.addBattle(naval[0],'Naval', naval[1],game.power(naval[4]),game.power(loser));
    }
}
function parseForeignWar(text) {
    var foreignWar = text.match(/to fight a foreign war[\s\S]*?\*\* Battle of (.*) \*\*[\s\S]*?(.*?) dic?e: [\s\S]*?(.*?) dic?e: [\s\S]*?War with \1/);
    if (foreignWar) {
        game.addBattle(foreignWar[0],'Foreign War',foreignWar[1],game.power(foreignWar[3]),game.power(foreignWar[2]));
    }
}

function parseHit(text) {
//     ** The Hapsburgs  Tercios  dice roll: 5, 5, 3 -- 2 extra hits **, making 4 total
    hit = text.match(/\*\* (.*?) dic?e roll: (.*?) -- (\d*) (?:extra )?hits?.*?(\*\*)?(, making \d* total)?$/);
    if (hit) {
        if (hit[4]) {
            game.hitDice(game.power(hit[1]),hit[2],hit[3]);
        } else {
            switch(hit[1]) {
            case 'Anti-Piracy':
            case 'Ottoman Piracy':
                break;
            default:
                game.hitDice(game.power(hit[1]),hit[2],hit[3]);
                break;
            }
        }
    } else {
        console.log('parseHit fail',text);
    }
}

function parseHits(text) {
    rolls = text.match(/.*dic?e roll:.*? --.*? hits?[ *]*/g);
    $(rolls).each(function() {
        parseHit(this);
    });
}
function parseAction(text) {
    var impulses = text.match(/Turn \d, .*impulse\n[\s\S]*?(?=(Turn \d, .*impulse)|$)/g);
    $(impulses).each(function() {
        parseImpulse(this);
    });
}
/*
** New World Phase **
Hapsburg explorer selected: Magellan
English explorer selected: Willoughby
French explorer selected: Roberval

  ** Magellan's exploration dice roll: 1, 1 = 2 +4(Magellan) -1(Uncharted Waters) = 5
No effect -- Magellan is returned to the force pool

  ** Willoughby's exploration dice roll: 4, 5 = 9 +0(Willoughby) -1(Uncharted Waters) = 8
Willoughby discovers the Great Lakes!!!
  ** England receives 1 Exploration VP for discovering the Great Lakes **

  ** Roberval's exploration dice roll: 6, 2 = 8 +0(Roberval) -1(Uncharted Waters) = 7
Roberval discovers the St. Lawrence River!!!
  ** France receives 1 Exploration VP for discovering the St. Lawrence River **
Hapsburg conquistador selected: Montejo
  ** Conquest dice roll: 2, 3 = 5 +2(Montejo) = 7
No effect -- Montejo is returned to the force pool



English explorer selected: Chancellor
French explorer selected: Verrazano

  ** Verrazano's exploration dice roll: 1, 3 = 4 +2(Verrazano) = 6
No effect -- Verrazano is returned to the force pool

  ** Chancellor's exploration dice roll: 5, 2 = 7 +1(Chancellor) = 8
No effect -- Chancellor is returned to the force pool
Hapsburg conquistador selected: Montejo
  ** Conquest dice roll: 2, 6 = 8 +2(Montejo) +2(Smallpox) = 12
Montejo conquers the Incas!!!
  ** The Hapsburgs receive 2 Conquest VPs for conquering the Incas **
*/
function parseNewWorld(text) {
    parseExplorers(text);
    parseConquests(text);
}

function parseExplorers(text) {
    var explorers = text.match(/.*explorer ((selected:)|(is)).*/g);
    if (explorers) {
        explorers.forEach(x=>{var matches = x.match(/(.*) explorer (?:(?:selected:)|(?:is)) (.*)/); game.Explorers[matches[2]]=Game.power(matches[1])});
    }
    var explorations = text.match(/.*discovers .*!!!/g)||[];
    explorations.forEach(text=>{
        exploration = text.match(/(.*) discovers (.*)!!!/);
        game.addBattle(text, 'Exploration', exploration[2], exploration[1]);
    });
}
function parseConquests(text) {
    var conquistadors = text.match(/.*conquistador selected:.*/g);
    if (conquistadors) {
        conquistadors.forEach(x=>{var matches = x.match(/(.*) conquistador selected: (.*)/); game.Conquistadors[matches[2]]=Game.power(matches[1])});
    }
    var conquests = text.match(/.*conquers .*!!!/g)||[];
    conquests.forEach(text=>{
        conquest = text.match(/(.*) conquers (.*)!!!/);
        game.addBattle(text, 'Conquest', conquest[2], conquest[1]);
    });
}
function parseWinter(text) {
}
$(function() {
    $('#input').on('change', update);

    $('#battles').on('mouseover', '.battle', function() {
        var text = $(this).find('.battleDesc').attr('title');
        $('textarea').highlightWithinTextarea({
            highlight: text
        });
        $('mark')[0].scrollIntoView({
            behavior: "instant", // or "auto" or "instant"
            block: "start" // or "end"
        });
			let scrollTop = $('.hwt-backdrop').scrollTop();
			$('textarea').scrollTop(scrollTop);
    });
    $('#stats').on('click','.power', function() {
        var power = $(this).closest('tr').attr('id');
        if (power == 'total') {
            $('tr.battle').show();
        } else {
            $('tr.battle').hide();
            $('tr.battle.'+power).show();
        }
    });
    $('#gameselector button').on('click', function() {
        $('textarea').val($('#'+$(this).attr('gameid')).text());
        update();
    });
    $('#gameselector button')[1].click();
});

