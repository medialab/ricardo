// Gehlhar, Mark. « Reconciling Bilateral Trade Data for Use in GTAP », 1996. https://core.ac.uk/display/4947985.
// discrepency treshold for a reporting R with parnter P : 
// - discrepency d = flow_value(R) / flow_value(P)
// - accurate flows when 0.8 <= d <= 1.25
// Reliability Index of eXports RIX = share of total accurately reported exports flows  / (total reported mirrored only - largest innacurate)
// When mirror flows, we choose the value of the higher RIX index.

const RIX = (n, graph) => {
    // GTAP
    let max_innaccurate = {discrepancy:0, targetWeight:0}
    let total_accurate_reports = 0
    let total_mirrored_reports = 0
    let inDegree = 0
    // for all mirror flows => calculate d
    graph.inEdges(n).forEach(e => {
    if (graph.getEdgeAttribute(e, 'mirrored')){
        const targetWeight = graph.getEdgeAttribute(e, 'targetWeight')
        const sourceWeight = graph.getEdgeAttribute(e, 'sourceWeight')
        const discrepancy = targetWeight / sourceWeight
        const accurate = discrepancy >= 0.8 && discrepancy < 1.26 
        if (accurate)
            total_accurate_reports += targetWeight
        else 
            //innaccurate
            if ( (discrepancy - 1) > max_innaccurate.discrepancy)
                max_innaccurate = {discrepancy: discrepancy - 1, targetWeight}
        total_mirrored_reports += targetWeight
    }
    inDegree += graph.getEdgeAttribute(e,'weight')
    })
    let RIX = 0
    if (total_mirrored_reports!==0){
        // calculate eliability Index of eXports RIX 
        RIX = total_accurate_reports / (total_mirrored_reports - max_innaccurate.targetWeight)
    }
    return {RIX, inDegree}
}

module.exports = {RIX}